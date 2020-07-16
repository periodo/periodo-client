"use strict";

const h = require('react-hyperscript')
    , { SectionHeading, Section, Box, Text, Link } = require('periodo-ui')

const citationHtml = `
<p>To cite a period found in PeriodO, you should cite the original source authority that defined the period:</p>
<blockquote>
<p>Library of Congress Subject Headings, LC Linked Data Service, s.v. “China--History--Rebellion of the Three Feudatories, 1673-1681,” accessed July 20, 2020, <a href="http://id.loc.gov/authorities/subjects/sh95008524.html">http://id.loc.gov/authorities/subjects/sh95008524.html</a>.</p>
</blockquote>
<p>If you wish to credit PeriodO for helping you find the period's original source:</p>
<blockquote>
<p>Library of Congress Subject Headings, LC Linked Data Service, s.v. “China--History--Rebellion of the Three Feudatories, 1673-1681,” <a href="http://id.loc.gov/authorities/subjects/sh95008524.html">http://id.loc.gov/authorities/subjects/sh95008524.html</a>, found in PeriodO, s.v. “Rebellion of the Three Feudatories, 1673-1681,” accessed July 15, 2020, <a href="http://n2t.net/ark:/99152/p06c6g3hq7j">http://n2t.net/ark:/99152/p06c6g3hq7j</a>.</p>
</blockquote>
<p>To cite an editorial note added to an period by PeriodO curators, use the permalink for the period:</p>
<blockquote>
<p>PeriodO, s.v. “Rebellion of the Three Feudatories, 1673-1681,” accessed July 15, 2020, <a href="http://n2t.net/ark:/99152/p06c6g3hq7j">http://n2t.net/ark:/99152/p06c6g3hq7j</a>.</p>
</blockquote>
<p>To cite an editorial note added to an authority by PeriodO curators, use the permalink for the authority:</p>
<blockquote>
<p>PeriodO, s.v. “Library of Congress. Library of Congress Subject Headings. 2015.” accessed July 15, 2020, <a href="http://n2t.net/ark:/99152/p06c6g3">http://n2t.net/ark:/99152/p06c6g3</a>.</p>
</blockquote>
<p>To cite the PeriodO dataset as a whole, use the permalink for the dataset:</p>
<blockquote>
<p>PeriodO: a gazetteer of periods for linking and visualizing data, accessed July 15, 2020, <a href="http://n2t.net/ark:/99152/p0">http://n2t.net/ark:/99152/p0</a>.</p>
</blockquote>
<p>Finally, if you wish to cite the PeriodO <em>project</em> please cite one of our <a href="http://perio.do/publications/">publications</a>, ideally one that is open access:</p>
<blockquote>
<p>Rabinowitz, Adam, Ryan Shaw, Sarah Buchanan, Patrick Golden, and Eric Kansa. “Making Sense of the Ways We Make Sense of the Past: The Periodo Project.” <em>Bulletin of the Institute of Classical Studies</em> 59, no. 2 (2016). <a href="https://doi.org/10.1111/j.2041-5370.2016.12037.x">https://doi.org/10.1111/j.2041-5370.2016.12037.x</a>.</p>
</blockquote>
`

module.exports = function About() {
  return (
    h('div', [
      h(SectionHeading, 'About'),

      h(Section, [
        h(Text, {
          fontSize: 2,
          mb: 3,
        }, [
          'PeriodO is a gazetteer of scholarly definitions of time periods. See the ',
          h(Link, {
            href: 'https://perio.do/',
          }, 'project homepage'),
          ' for more information.',
        ]),

        h(Text, {
          fontSize: 2,
        }, [
          'You are using the Web client for browsing and editing period definitions. There is a ',
          h(Link, {
            href: 'http://perio.do/guide/',
          }, 'guide'),
          ' available to assist in navigating this application.',
        ]),
      ]),

      h(SectionHeading, 'Citing'),
      h(Section, {
        fontSize: 2,
      }, [
        h(Box, {
          sx: {
            a: {
              color: 'elements.link',
              textDecoration: 'none',
              cursor: 'pointer',
              ':hover': {
                textDecoration: 'underline',
              },
            },
            lineHeight: '1.33em',
            '& > p, blockquote': {
              mb: 2,
            },
            blockquote: {
              borderLeftColor: 'colorsets.page.border',
              borderLeftStyle: 'solid',
              borderLeftWidth: '3px',
              ml: 3,
              pl: 2,
              py: 2,
              color: theme => theme.colors.gray[7],
            },
            'blockquote + p': {
              mt: 3,
            },
          },
          dangerouslySetInnerHTML: {
            __html: citationHtml,
          },
        }),
      ]),
    ])
  )
}
